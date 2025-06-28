import jwt from "jsonwebtoken";

const authHandler = (
    req,
    res,
    next
) => {

    let JWT_SECRET = process.env.JWT_SECRET;

    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers.authorization;
        token = authHeader?.split(" ")[1];
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "No JWT secret provided" });
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    } else {
        return res.status(401).json({ message: "No token provided" });
    }

    next();
};

export function isAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};

export default authHandler;