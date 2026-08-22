"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const start = async () => {
    const app = (0, app_1.buildApp)();
    try {
        const port = parseInt(env_1.env.PORT, 10);
        await app.listen({ port, host: '0.0.0.0' });
        logger_1.logger.info(`Server successfully started on port ${port} in ${env_1.env.NODE_ENV} mode`);
    }
    catch (err) {
        logger_1.logger.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map