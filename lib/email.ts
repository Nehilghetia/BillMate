import nodemailer from 'nodemailer';

export const sendOrderConfirmationEmail = async (order: any, email: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: `Order Confirmation - ${order.bill_number}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Thank you for your order!</h2>
        <p>Hi there,</p>
        <p>Your order has been received and is processing.</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order ID:</strong> ${order.bill_number}</p>
        <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.order_status}</p>
        
        <hr />
        
        <p>We will notify you once your order is shipped.</p>
        
        <p>Best regards,<br/>BillMate Team</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Welcome to BillMate!',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to BillMate, ${name}!</h2>
        <p>We are excited to have you on board.</p>
        <p>You can now browse our catalog and place orders.</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to your Account</a>
        <br/><br/>
        <p>Best regards,<br/>BillMate Team</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

export const sendLoginAlert = async (email: string, time: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'New Login to BillMate',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">New Login Detected</h2>
        <p>A new login was detected on your BillMate account.</p>
        <p><strong>Time:</strong> ${time}</p>
        <br/>
        <p>If this was you, you can ignore this email.</p>
        <p style="color: red;">If this was not you, please reset your password immediately.</p>
        <br/>
        <p>Best regards,<br/>BillMate Security Team</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Login alert sent to:', email);
    } catch (error) {
        console.error('Error sending login alert:', error);
    }
};

export const sendMagicLinkEmail = async (email: string, link: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Time to Login to BillMate',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Login to BillMate</h2>
        <p>Click the button below to sign in instantly.</p>
        <br/>
        <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In Now</a>
        <br/><br/>
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${link}</p>
        <br/>
        <p>Best regards,<br/>BillMate Security Team</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Magic Login link sent to:', email);
    } catch (error) {
        console.error('Error sending magic link:', error);
        throw error;
    }
};
