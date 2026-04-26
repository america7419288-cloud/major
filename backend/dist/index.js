"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const page_routes_1 = __importDefault(require("./routes/page.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const database_routes_1 = __importDefault(require("./routes/database.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/workspaces', workspace_routes_1.default);
app.use('/api/pages', page_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api', tasks_1.default);
app.use('/api/databases', database_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/health', health_routes_1.default);
const http_1 = require("http");
const socket_1 = require("./socket");
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket Service
socket_1.socketService.initialize(httpServer);
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
