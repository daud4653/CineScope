import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import loginImage from '../assets/18691.jpg';
import './Login.css';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const onFinish = (values) => {
    console.log('Success:', values);
    message.success('Password reset link has been sent to your email!');
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
            <Title level={2} className="login-title">Forgot Password</Title>
            <Text className="login-subtitle">
              Enter your email address and we'll send you a link to reset your password
            </Text>
            <Form
              name="forgotPassword"
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
                  prefix={<MailOutlined />}
                  placeholder="Enter your email"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="login-button"
                >
                  Send Reset Link
                </Button>
              </Form.Item>

              <div className="signup-link-container">
                <Link to="/login" className="link-text back-link">
                  <ArrowLeftOutlined /> Back to Sign In
                </Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

