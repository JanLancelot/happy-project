import React, { useState, useRef } from "react";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload } from "lucide-react";
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
            const { studentId, studentName, parentEmail, amount, items, remainingBalance } = data;

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
                "CNHycKmcSVKvylnMl"
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
        <h2 className="text-2xl font-semibold mb-6">Send Payment Confirmation Emails</h2>
        
        <div className="mb-6">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
            ref={fileInputRef}
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload a CSV file with columns: studentId, studentName, parentEmail, amount, items, remainingBalance
          </p>
        </div>

        <Button
          onClick={handleSendEmails}
          disabled={isLoading || !csvFile}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Send Emails
            </>
          )}
        </Button>

        {isLoading && (
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500 mt-2 text-center">{progress}% complete</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mt-4 bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </Sidebar>
  );
};

export default SendPaymentConfirmationEmail;