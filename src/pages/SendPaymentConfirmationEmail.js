import React, { useState, useRef } from "react";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import Sidebar from "../components/Sidebar";

const SendPaymentConfirmationEmail = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError("");
    } else {
      setCsvFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleSendEmails = async () => {
    if (!csvFile) {
      setError("Please select a CSV file.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          const paymentData = result.data;
          const totalEmails = paymentData.length;

          for (let i = 0; i < paymentData.length; i++) {
            const data = paymentData[i];
            const {
              studentId,
              studentName,
              parentEmail,
              amount,
              items,
              remainingBalance,
            } = data;

            if (!studentId || !parentEmail || !amount || !items) {
              console.error(`Missing data for student ${studentId}. Skipping.`);
              continue;
            }

            try {
              await emailjs.send(
                "service_qp5j2a7",
                "template_koow7fe",
                {
                  to_email: parentEmail,
                  student_id: studentId,
                  student_name: studentName,
                  amount: amount,
                  items: items,
                  remaining_balance: remainingBalance,
                },
                "dql0tAyLWuaY0uzbDHYnN"
              );
              console.log(`Email sent to ${parentEmail}`);
            } catch (error) {
              console.error(`Error sending email to ${parentEmail}:`, error);
            }

            setProgress(Math.round(((i + 1) / totalEmails) * 100));
          }

          setSuccess("Payment confirmation emails sent successfully!");
        },
        error: (error) => {
          console.error("Error parsing CSV file:", error);
          setError("Error parsing CSV file. Please check the format.");
        },
      });
    } catch (error) {
      console.error("Error sending emails:", error);
      setError("Error sending emails. Please try again later.");
    } finally {
      setIsLoading(false);
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">
          Send Payment Confirmation Emails
        </h2>

        <div className="mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            ref={fileInputRef}
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload a CSV file with columns: studentId, studentName, parentEmail,
            amount, items, remainingBalance
          </p>
        </div>

        <button
          onClick={handleSendEmails}
          disabled={isLoading || !csvFile}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send Emails"}
        </button>

        {isLoading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {progress}% complete
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 text-green-700 bg-green-100 rounded-lg">
            {success}
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default SendPaymentConfirmationEmail;
