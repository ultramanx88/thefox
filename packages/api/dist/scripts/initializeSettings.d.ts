#!/usr/bin/env node
/**
 * Script to initialize default settings in Firebase
 * Run this script after setting up Firebase to populate default settings
 */
declare function initializeSettings(): Promise<void>;
export { initializeSettings };
