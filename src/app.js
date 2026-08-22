"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
function buildApp() {
    const app = (0, fastify_1.default)({
        logger: logger_1.logger,
    });
    app.get('/health', async (request, reply) => {
        return {
            status: 'ok',
            environment: env_1.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };
    });
    return app;
}
//# sourceMappingURL=app.js.map