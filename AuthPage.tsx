import React from 'react';
import AuthLayout from './components/layout/AuthLayout';
import BrandHeader from './components/ui/BrandHeader';
import LoginPage from './LoginPage';

const AuthPage: React.FC = () => {
    return (
        <AuthLayout>
            <BrandHeader subtitle="Seller Dashboard - Manage your products" />
            <LoginPage />
        </AuthLayout>
    );
};

export default AuthPage;