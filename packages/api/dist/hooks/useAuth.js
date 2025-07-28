"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
const auth_1 = require("../firebase/auth");
function useAuth() {
    const [authState, setAuthState] = (0, react_1.useState)({
        user: null,
        loading: true,
        error: null,
    });
    (0, react_1.useEffect)(() => {
        const unsubscribe = auth_1.FirebaseAuthService.onAuthStateChanged((user) => {
            setAuthState({
                user,
                loading: false,
                error: null,
            });
        });
        return unsubscribe;
    }, []);
    const signIn = async (email, password) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await auth_1.FirebaseAuthService.signIn(email, password);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign in failed'
            }));
            throw error;
        }
    };
    const signUp = async (email, password, displayName) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await auth_1.FirebaseAuthService.signUp(email, password, displayName);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign up failed'
            }));
            throw error;
        }
    };
    const signOut = async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await auth_1.FirebaseAuthService.signOut();
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Sign out failed'
            }));
            throw error;
        }
    };
    const sendPasswordResetEmail = async (email) => {
        try {
            await auth_1.FirebaseAuthService.sendPasswordResetEmail(email);
        }
        catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: error.message || 'Password reset failed'
            }));
            throw error;
        }
    };
    return {
        ...authState,
        signIn,
        signUp,
        signOut,
        sendPasswordResetEmail,
    };
}
