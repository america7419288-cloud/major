"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workspace_controller_1 = require("../controllers/workspace.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', workspace_controller_1.createWorkspace);
router.get('/', workspace_controller_1.getWorkspaces);
router.get('/:id', workspace_controller_1.getWorkspaceById);
router.put('/:id', workspace_controller_1.updateWorkspace);
router.delete('/:id', workspace_controller_1.deleteWorkspace);
// Member management
router.post('/:id/members', workspace_controller_1.addWorkspaceMember);
router.patch('/:id/members/:memberId', workspace_controller_1.updateMemberRole);
router.delete('/:id/members/:memberId', workspace_controller_1.removeWorkspaceMember);
exports.default = router;
