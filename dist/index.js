"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("./routes/auth.route");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./lib/db");
const message_route_1 = require("./routes/message.route");
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./lib/socket");
dotenv_1.default.config();
const port = process.env.PORT;
socket_1.app.use(express_1.default.json());
socket_1.app.use((0, cookie_parser_1.default)());
socket_1.app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
socket_1.app.use("/api/auth", auth_route_1.authRoutes);
socket_1.app.use("/api/messages", message_route_1.messageRoutes);
socket_1.app.get("/", (req, res) => {
    res.send("Hello World!");
});
socket_1.server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    (0, db_1.connectDB)();
});
exports.default = socket_1.app;
