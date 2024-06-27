import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [originalLogs, setOriginalLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsRef = collection(db, "auditLogs");
        const q = query(logsRef, orderBy("timestamp", "desc"));

        const logsSnapshot = await getDocs(q);
        const logsData = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);
        setOriginalLogs(logsData);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    let filteredLogs = [...originalLogs];

    if (filterAction !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.actionType === filterAction
      );
    }

    if (searchEmail) {
      filteredLogs = filteredLogs.filter((log) =>
        log.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp.toDate() >= startDate.toDate()
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp.toDate() <= endDate.toDate()
      );
    }

    setLogs(filteredLogs);
  }, [filterAction, searchEmail, startDate, endDate, originalLogs]);

  const handleReset = () => {
    setFilterAction("all");
    setSearchEmail("");
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Audit Logs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="filterAction" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Action
            </label>
            <Select
              id="filterAction"
              value={filterAction}
              onValueChange={(value) => setFilterAction(value)}
            >
              <Select.Option value="all">All Actions</Select.Option>
              <Select.Option value="login_success">Successful Login</Select.Option>
              <Select.Option value="login_failed">Failed Login</Select.Option>
            </Select>
          </div>

          <div>
            <label htmlFor="searchEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Search by Email
            </label>
            <Input
              type="text"
              id="searchEmail"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              id="startDate"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              id="endDate"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
            />
          </div>
        </div>

        <div className="mb-6">
          <Button onClick={handleReset} variant="outline">Reset Filters</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{moment(log.timestamp.toDate()).format("YYYY-MM-DD HH:mm:ss")}</TableCell>
                <TableCell>{log.userId}</TableCell>
                <TableCell>{log.actionType}</TableCell>
                <TableCell>{log.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Sidebar>
  );
}

export default AuditLogs;