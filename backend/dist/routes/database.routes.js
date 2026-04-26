"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_controller_1 = require("../controllers/database.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Database routes
router.post('/', database_controller_1.createDatabase);
router.get('/', database_controller_1.getDatabases);
router.get('/:id', database_controller_1.getDatabaseById);
router.patch('/:id', database_controller_1.updateDatabase);
router.delete('/:id', database_controller_1.deleteDatabase);
// Item routes
router.post('/items', database_controller_1.createDatabaseItem);
router.patch('/items/:id', database_controller_1.updateDatabaseItem);
router.delete('/items/:id', database_controller_1.deleteDatabaseItem);
// View routes
router.post('/views', database_controller_1.createDatabaseView);
router.patch('/views/:id', database_controller_1.updateDatabaseView);
router.delete('/views/:id', database_controller_1.deleteDatabaseView);
exports.default = router;
