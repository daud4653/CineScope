import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import loginImage from '../assets/18691.jpg';
import './Login.css';

const { Title, Text } = Typography;
const API_BASE_URL = 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error(data.message || 'Login failed');
      }
    } catch (error) {
      message.error('Network error. Please check if backend is running.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-image-section">
          <img src={loginImage} alt="Cinema" className="login-image" />
        </div>
        <div className="login-form-section">
          <div className="login-form-content">
            <h1 className="login-brand">CineScope</h1>
            <Title level={2} className="login-title">Welcome Back</Title>
            <Text className="login-subtitle">Sign in to continue to CineScope</Text>
            <Form
              name="login"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              layout="vertical"
              className="login-form"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: 'Please input your email!',
                  },
                  {
                    type: 'email',
                    message: 'Please enter a valid email!',
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your email"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your password!',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  className="login-button"
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div className="login-links">
              <Link to="/signup" className="login-link">Don't have an account? Sign Up</Link>
              <Link to="/forgot-password" className="login-link">Forgot Password?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
