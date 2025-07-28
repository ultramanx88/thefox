"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsErrorType = void 0;
// Error types
var SettingsErrorType;
(function (SettingsErrorType) {
    SettingsErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    SettingsErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    SettingsErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    SettingsErrorType["SYNC_CONFLICT"] = "SYNC_CONFLICT";
    SettingsErrorType["STORAGE_ERROR"] = "STORAGE_ERROR";
    SettingsErrorType["IMAGE_PROCESSING_ERROR"] = "IMAGE_PROCESSING_ERROR";
})(SettingsErrorType || (exports.SettingsErrorType = SettingsErrorType = {}));
