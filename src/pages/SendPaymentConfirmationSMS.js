import React, { useState } from "react";
import Papa from "papaparse";
import { getFunctions, httpsCallable } from "firebase/functions";
import Sidebar from "../components/Sidebar";

function SendPaymentConfirmationSMS() {
  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const functions = getFunctions();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    if (file) {
      Papa.parse(file, {
        header: true,
        preview: 5,
        complete: (result) => {
          setPreviewData(result.data);
        },
      });
    }
  };

  const showToast = (message, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendSMS = async () => {
    if (!csvFile) {
      showToast("Please select a CSV file.", true);
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          const paymentData = result.data;
          const totalRecords = paymentData.length;

          const sendSMSPromises = paymentData.map(async (data, index) => {
            const { studentId, studentName, phoneNumber, amountPaid, remainingBalance, items } = data;

            if (!studentId || !studentName || !phoneNumber || !amountPaid || !remainingBalance || !items) {
              console.error(`Missing data for student ${studentId}. Skipping.`);
              return;
            }

            const sendSMS = httpsCallable(functions, "sendPaymentConfirmationSMS");
            const result = await sendSMS({
              phoneNumber: phoneNumber,
              message: `Payment confirmation for ${studentName} (ID: ${studentId}): Amount paid: $${amountPaid}, Remaining balance: $${remainingBalance}, Items: ${items}`,
            });

            console.log(`SMS sent to ${phoneNumber}: ${result.data.message}`);
            setProgress(((index + 1) / totalRecords) * 100);
          });

          await Promise.all(sendSMSPromises);
          showToast("Payment confirmation SMS messages sent successfully!");
        },
        error: (error) => {
          console.error("Error parsing CSV file:", error);
          showToast("Error parsing CSV file. Please check the format.", true);
        },
      });
    } catch (error) {
      console.error("Error sending SMS messages:", error);
      showToast("Error sending SMS messages. Please try again later.", true);
    } finally {
      setIsLoading(false);
      setCsvFile(null);
      setProgress(0);
      setPreviewData([]);
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Send Payment Confirmation SMS</h2>

        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {previewData.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">Preview (first 5 rows)</h3>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Student ID</th>
                  <th className="py-2 px-4 border-b">Student Name</th>
                  <th className="py-2 px-4 border-b">Phone Number</th>
                  <th className="py-2 px-4 border-b">Amount Paid</th>
                  <th className="py-2 px-4 border-b">Remaining Balance</th>
                  <th className="py-2 px-4 border-b">Items</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-2 px-4 border-b">{row.studentId}</td>
                    <td className="py-2 px-4 border-b">{row.studentName}</td>
                    <td className="py-2 px-4 border-b">{row.phoneNumber}</td>
                    <td className="py-2 px-4 border-b">{row.amountPaid}</td>
                    <td className="py-2 px-4 border-b">{row.remainingBalance}</td>
                    <td className="py-2 px-4 border-b">{row.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={handleSendSMS}
          disabled={isLoading || !csvFile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send SMS"}
        </button>

        {isLoading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Sending SMS messages: {Math.round(progress)}% complete</p>
          </div>
        )}

        {toastMessage && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md ${toastMessage.isError ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            {toastMessage.text}
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default SendPaymentConfirmationSMS;