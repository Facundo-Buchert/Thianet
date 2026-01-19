import React from 'react';
import HeaderA from './HeaderA';
import MenuA from './MenuA';
import './AdminLayout.css';

export const AdminLayout = ({ children }) => {
    return (
        <div className="admin-shell">
            <HeaderA />
            <div className="admin-secondline">
                <MenuA />
                <main className="admin-main">
                    <div className="admin-container">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
