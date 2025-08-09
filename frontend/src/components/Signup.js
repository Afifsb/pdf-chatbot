import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Add email state
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !email || !password) {
            setError('Username, email, and password are required.');
            return;
        }

        try {
            await api.post('/auth/signup', { username, email, password });
            navigate('/login');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Signup failed. Please try again.');
            }
        }
    };

    return (
        <div className="auth-container">
            <h1>Create Account</h1>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                    />
                </div>
                <div className="form-group"> 
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a password"
                    />
                </div>
                <button type="submit" className="auth-btn">Sign Up</button>
                {error && <p className="error-message">{error}</p>}
            </form>
            <p className="auth-switch">
                Already have an account? <Link to="/login">Log In</Link>
            </p>
        </div>
    );
};

export default Signup;