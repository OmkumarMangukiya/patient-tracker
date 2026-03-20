import { tokenVerify } from "../auth/jwtToken.js";

/**
 * Express middleware that extracts and verifies the JWT token
 * from the Authorization header, then attaches the decoded
 * user data to `req.user`.
 *
 * Usage in app.js:
 *   import { authenticate } from "./middleware/authMiddleware.js";
 *   app.use("/doctor", authenticate, doctorRoutes);
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = tokenVerify(token);

  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }

  req.user = decoded;
  next();
}
