"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const page_controller_1 = require("../controllers/page.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', page_controller_1.createPage);
router.get('/', page_controller_1.getPages);
router.get('/:id', (0, page_controller_1.checkPagePermission)('CAN_VIEW'), page_controller_1.getPageById);
router.put('/:id', (0, page_controller_1.checkPagePermission)('CAN_EDIT'), page_controller_1.updatePage);
router.delete('/:id', (0, page_controller_1.checkPagePermission)('FULL_ACCESS'), page_controller_1.deletePage);
// Version history
router.get('/:id/versions', (0, page_controller_1.checkPagePermission)('CAN_VIEW'), page_controller_1.getPageVersions);
router.get('/:id/versions/:versionId', (0, page_controller_1.checkPagePermission)('CAN_VIEW'), page_controller_1.getPageVersionById);
router.post('/:id/restore/:versionId', (0, page_controller_1.checkPagePermission)('CAN_EDIT'), page_controller_1.restorePageVersion);
// Permissions & Sharing
router.post('/:id/share', (0, page_controller_1.checkPagePermission)('FULL_ACCESS'), page_controller_1.sharePage);
router.get('/:id/permissions', (0, page_controller_1.checkPagePermission)('FULL_ACCESS'), page_controller_1.getPagePermissions);
router.delete('/:id/permissions/:permissionId', (0, page_controller_1.checkPagePermission)('FULL_ACCESS'), page_controller_1.removePagePermission);
exports.default = router;
