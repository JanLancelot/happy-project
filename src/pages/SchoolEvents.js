import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";

function SchoolEvents() {
  const [events, setEvents] = useState([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    fetchEvents();
  }, []);

  const handleAddEvent = async () => {
    try {
      await addDoc(collection(db, "events"), {
        ...newEvent,
        timestamp: serverTimestamp(),
      });

      setIsAddEventModalOpen(false);
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
      });

      alert("Event added successfully!");
    } catch (error) {
      console.error("Error adding event: ", error);
      alert("Error adding event. Please try again later.");
    }
  };

  const handleEditEvent = async () => {
    try {
      if (!eventToEdit) return;

      await updateDoc(doc(db, "events", eventToEdit.id), {
        ...eventToEdit,
      });

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventToEdit.id ? eventToEdit : event
        )
      );

      setIsEditModalOpen(false);
      setEventToEdit(null);
      alert("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event: ", error);
      alert("Error updating event. Please try again later.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", eventId));

        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== eventId)
        );

        alert("Event deleted successfully!");
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert("Error deleting event. Please try again later.");
      }
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">School Events</h2>

        <button
          onClick={() => setIsAddEventModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Add Event
        </button>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b border-gray-200">Title</th>
              <th className="py-2 border-b border-gray-200">Date</th>
              <th className="py-2 border-b border-gray-200">Start Time</th>
              <th className="py-2 border-b border-gray-200">End Time</th>
              <th className="py-2 border-b border-gray-200">Description</th>
              <th className="py-2 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="border px-4 py-2">{event.title}</td>
                <td className="border px-4 py-2">
                  {moment(new Date(event.date)).format("LL")}{" "}
                </td>
                <td className="border px-4 py-2">{event.startTime}</td>
                <td className="border px-4 py-2">{event.endTime}</td>
                <td className="border px-4 py-2">{event.description}</td>{" "}
                <td className="border px-4 py-2">
                  <button
                    onClick={() => {
                      setEventToEdit({ ...event });
                      setIsEditModalOpen(true);
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2" // Added margin-right for spacing
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Modal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Date:
                </label>
                <input
                  type="date"
                  id="date"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="startTime"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Start Time:
                </label>
                <input
                  type="time"
                  id="startTime"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newEvent.startTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, startTime: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  End Time:
                </label>
                <input
                  type="time"
                  id="endTime"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newEvent.endTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, endTime: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Event</h3>
            {eventToEdit && (
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Title:
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={eventToEdit.title}
                    onChange={(e) =>
                      setEventToEdit({ ...eventToEdit, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Date:
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={eventToEdit.date}
                    onChange={(e) =>
                      setEventToEdit({ ...eventToEdit, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Start Time:
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={eventToEdit.startTime}
                    onChange={(e) =>
                      setEventToEdit({
                        ...eventToEdit,
                        startTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    End Time:
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={eventToEdit.endTime}
                    onChange={(e) =>
                      setEventToEdit({
                        ...eventToEdit,
                        endTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Description:
                  </label>
                  <textarea
                    id="description"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={eventToEdit.description}
                    onChange={(e) =>
                      setEventToEdit({
                        ...eventToEdit,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditEvent}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default SchoolEvents;
