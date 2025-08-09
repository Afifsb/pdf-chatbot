import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await api.post('/auth/login', { identifier, password });
            const { token } = res.data;
            localStorage.setItem('token', token);
            navigate('/');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        }
    };

    return (
        <div className="auth-container">
            <h1>Welcome Back</h1>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label>Username or Email</label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your username or email"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                    />
                </div>
                <button type="submit" className="auth-btn">Log In</button>
                {error && <p className="error-message">{error}</p>}
            </form>
            <p className="auth-switch">
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;