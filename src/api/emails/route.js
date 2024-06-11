import { Resend } from 'resend';
import React from 'react';
import Email from "../../components/Email";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendReminderEmail = async (studentEmail, student, incompleteClearances) => {
  try {
    await resend.emails.send({
      from: 'you@example.com',
      to: studentEmail,
      subject: 'hello world',
      react: <Email student={student} incompleteClearances={incompleteClearances} />,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};