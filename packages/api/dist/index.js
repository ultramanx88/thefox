"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.SettingsManager = exports.VerificationService = exports.RegistrationService = void 0;
// Export Firebase services
__exportStar(require("./firebase"), exports);
// Export services
var RegistrationService_1 = require("./services/RegistrationService");
Object.defineProperty(exports, "RegistrationService", { enumerable: true, get: function () { return RegistrationService_1.RegistrationService; } });
var VerificationService_1 = require("./services/VerificationService");
Object.defineProperty(exports, "VerificationService", { enumerable: true, get: function () { return VerificationService_1.VerificationService; } });
var SettingsManager_1 = require("./services/SettingsManager");
Object.defineProperty(exports, "SettingsManager", { enumerable: true, get: function () { return SettingsManager_1.SettingsManager; } });
// Mock API function. In a real app, this would fetch data from your backend.
const getCategories = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        { id: '1', name: 'Vegetables & Fruits', slug: 'vegetables-fruits' },
        { id: '2', name: 'Meat & Seafood', slug: 'meat-seafood' },
        { id: '3', name: 'Bakery & Dairy', slug: 'bakery-dairy' },
        { id: '4', name: 'Pantry Staples', slug: 'pantry-staples' },
        { id: '5', name: 'Beverages', slug: 'beverages' },
        { id: '6', name: 'Snacks & Sweets', slug: 'snacks-sweets' },
    ];
};
exports.getCategories = getCategories;
