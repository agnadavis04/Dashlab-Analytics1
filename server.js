require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const session = require("express-session");
const axios = require("axios");

let logger;
try {
  const winston = require("winston");
  logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: "error.log", level: "error" }),
      new winston.transports.File({ filename: "combined.log" }),
      new winston.transports.Console(),
    ],
  });
} catch (error) {
  console.warn("Winston not found, falling back to console logging:", error.message);
  logger = {
    info: console.log,
    error: console.error,
  };
}

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// Use express.json() for JSON parsing instead of formidable for this endpoint
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info("✅ Connected to MongoDB"))
  .catch((err) => logger.error("❌ MongoDB Error:", err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  linkedinId: { type: String },
  dashboards: [
    {
      name: String,
      description: String,
      rawData: [[String]],
      summary: {
        totalRows: Number,
        totalColumns: Number,
        cleanedRows: Number,
        nullValuesRemoved: Number,
      },
      analysis: Object,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});
const User = mongoose.model("User", userSchema);

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    logger.error("Access Denied: No Token Provided");
    return res.status(403).json({ message: "Access Denied: No Token Provided" });
  }
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    logger.error("Invalid Token: %s", error.message);
    res.status(401).json({ message: "Invalid Token" });
  }
};

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    logger.info("User created successfully: %s", email);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    logger.error("Signup error: %s", error.message);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.password) {
      return res.status(400).json({
        message: "This account uses social login. Please log in using Google or LinkedIn.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    logger.info("Login successful for user: %s", email);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    logger.error("Login error: %s", error.message);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({ googleId: profile.id, email: profile.emails[0].value });
          await user.save();
          logger.info("New Google user created: %s", profile.emails[0].value);
        }
        return done(null, user);
      } catch (error) {
        logger.error("Google OAuth error: %s", error.message);
        return done(error, null);
      }
    }
  )
);

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ linkedinId: profile.id });
        if (!user) {
          user = new User({ linkedinId: profile.id, email: profile.emails[0].value });
          await user.save();
          logger.info("New LinkedIn user created: %s", profile.emails[0].value);
        }
        return done(null, user);
      } catch (error) {
        logger.error("LinkedIn OAuth error: %s", error.message);
        return done(error, null);
      }
    }
  )
);

app.post("/api/analyze", verifyToken, async (req, res) => {
  try {
    const { dataset, workspaceName, workspaceDescription } = req.body;
    logger.info("Received dataset for analysis: %s", dataset);

    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      logger.error("Invalid or empty dataset received: %s", dataset);
      return res.status(400).json({ error: "Invalid or empty dataset provided", details: "Dataset must be a non-empty array" });
    }

    // Robust fallback for malformed dataset
    const validDataset = dataset.length > 0 && Array.isArray(dataset[0]) && dataset[0].length > 0
      ? dataset
      : [["DefaultHeader" + (dataset[0] ? `_${dataset[0].length}` : "")], ...dataset.map(row => Array.isArray(row) ? row : [""])];

    logger.info("Processed valid dataset (first 2 rows): %s", validDataset.slice(0, 2));

    // Send to Flask for ML analysis
    const flaskResponse = await axios.post("http://127.0.0.1:5001/analyze", {
      dataset: validDataset,
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.error("User not found for ID: %s", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    const name = workspaceName || `Dashboard ${user.dashboards.length + 1}`;
    const description = workspaceDescription || "Auto-generated dashboard";
    const { summary, analysis } = flaskResponse.data;

    user.dashboards.push({
      name,
      description,
      rawData: validDataset,
      summary: summary || {
        totalRows: validDataset.length,
        totalColumns: validDataset[0].length,
        cleanedRows: validDataset.length,
        nullValuesRemoved: 0,
      },
      analysis: analysis || {},
    });
    await user.save();

    logger.info("Dashboard saved successfully for user: %s", user.email);
    res.json({
      message: "Dashboard saved successfully",
      analysis: flaskResponse.data.analysis,
      rawData: validDataset,
      summary: flaskResponse.data.summary,
    });
  } catch (error) {
    logger.error("AI processing failed: %s", error.message);
    if (error.response) {
      logger.error("Flask response error: %s", JSON.stringify(error.response.data));
      return res.status(error.response.status).json({
        error: "AI processing failed",
        details: error.response.data.error || error.response.data.details || error.message,
      });
    }
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

app.post("/api/fetch-dataset", async (req, res) => {
  try {
    const { datasetUrl } = req.body;
    if (!datasetUrl) {
      return res.status(400).json({ error: "Dataset URL is required" });
    }

    const response = await axios.get(datasetUrl);
    const text = response.data;

    const rows = text.split("\n").filter(row => row.trim());
    const rawData = rows.map(row => row.split(",").map(cell => (cell.trim() === "" ? "N/A" : cell.trim())));
    if (rawData.length === 0 || !rawData[0].length) {
      return res.status(400).json({ error: "No valid data found in URL content" });
    }

    const uniqueData = Array.from(new Set(rawData.map(JSON.stringify))).map(JSON.parse);
    const summary = {
      totalRows: rawData.length,
      totalColumns: rawData[0].length,
      cleanedRows: uniqueData.length,
      nullValuesRemoved: rawData.length - uniqueData.length,
    };

    res.json({ dataset: uniqueData, summary });
  } catch (error) {
    logger.error("Failed to fetch dataset: %s", error.message);
    res.status(500).json({ error: "Failed to fetch dataset", details: error.message });
  }
});

app.get("/api/get-dashboards", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      logger.error("User not found for ID: %s", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }
    logger.info("Dashboards retrieved for user: %s", user.email);
    res.json(user.dashboards || []);
  } catch (error) {
    logger.error("Failed to retrieve dashboards: %s", error.message);
    res.status(500).json({ error: "Failed to retrieve dashboards" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`🚀 Node.js server running on port ${PORT}`));