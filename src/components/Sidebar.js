import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  InboxIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  HomeIcon,
  DocumentCheckIcon,
  UsersIcon,
  UserIcon,
  XMarkIcon,
  Bars3Icon,
  CalendarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Spinner } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";

const auth = getAuth();
const db = getFirestore();

const navigationOptions = {
  admin: [
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    { name: "Class Management", href: "/classes", icon: UserGroupIcon },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    {
      name: "Payment Confirmation",
      href: "/send-payment-confirmation",
      icon: CreditCardIcon,  
    },
    {
      name: "Activity Log",
      href: "/audit-log",
      icon: ClockIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "System Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "super-admin": [
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    { name: "Class Management", href: "/classes", icon: UserGroupIcon },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    {
      name: "Payment Confirmation",
      href: "/send-payment-confirmation",
      icon: CreditCardIcon,  
    },
    {
      name: "User Administration",
      href: "/user-management",
      icon: ShieldCheckIcon,
    },
    {
      name: "Activity Log",
      href: "/audit-log",
      icon: ClockIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "System Settings", href: "#", icon: Cog6ToothIcon },
  ],
  faculty: [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-faculty",
      icon: HomeIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    {
      name: "Course Requirements",
      href: "/manage-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "My Classes",
      href: "/view-classes",
      icon: UserGroupIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    {
      name: "Account Settings",
      href: "#",
      icon: Cog6ToothIcon,
      children: [],
    },
  ],
  student: [
    {
      name: "My Clearance",
      href: "/student-clearance",
      icon: DocumentCheckIcon,
    },
    {
      name: "Messages",
      href: "/view-messages-student",
      icon: InboxIcon,
    },
    {
      name: "Account Settings",
      href: "#",
      icon: Cog6ToothIcon,
      children: [],
    },
  ],
  "Character Renewal Office": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "Finance": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "Payment Confirmation",
      href: "/send-payment-confirmation",
      icon: CreditCardIcon,  
    },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "Guidance Office": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "Office of The Dean": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "Student Council": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ],
  "OSAS": [
    {
      name: "Clearance Requests",
      href: "/approve-clearance-office",
      icon: HomeIcon,
    },
    {
      name: "Office Requirements",
      href: "/manage-office-requirements",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: ClipboardDocumentListIcon,
    },
    {
      name: "Student Directory",
      href: "/student-master-list",
      icon: UsersIcon,
    },
    {
      name: "School Events",
      href: "/school-events",
      icon: CalendarIcon,
    },
    { name: "Messages", href: "/view-messages", icon: InboxIcon },
    { name: "Account Settings", href: "#", icon: Cog6ToothIcon },
  ]
};

const defaultNavigation = [
  {
    name: "Clearance Requests",
    href: "/approve-clearance-office",
    icon: HomeIcon,
  },
  {
    name: "Office Requirements",
    href: "/manage-office-requirements",
    icon: ClipboardDocumentCheckIcon,
  },
  { name: "Messages", href: "/view-messages", icon: InboxIcon },
  {
    name: "Student Clearance",
    href: "/office-clearance-manual",
    icon: AcademicCapIcon,
  },
  { name: "Office Settings", href: "#", icon: Cog6ToothIcon },
];

const teams = [
  { id: 1, name: "Teachers", href: "/teachers", initial: "T" },
  { id: 2, name: "Students", href: "/students", initial: "S" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userCollectionRef = collection(db, "users");
          const q = query(userCollectionRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            setUserRole(userData.role);
          } else {
            console.error("User document not found!");
          }

          console.log("UID: ", user.uid);
          console.log("Role: ", userRole);
          setCurrentUser(user);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        actionType: "logout",
        email: currentUser.email,
      });

      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  let navigation = defaultNavigation;
  if (userRole && navigationOptions[userRole]) {
    navigation = navigationOptions[userRole].map((item) => ({
      ...item,
      current: location.pathname === item.href,
    }));
  }

  const getInitials = (email) => {
    if (!email) return "";
    const names = email.split("@")[0].split(/\.|_|-/);
    return names
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join(""); 
  };

  return (
    <>
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <Spinner size="xl" color="blue.500" />
          </div>
        ) : (
          <div>
            <Transition.Root show={sidebarOpen} as={Fragment}>
              <Dialog
                as="div"
                className="relative z-50 lg:hidden"
                onClose={setSidebarOpen}
              >
                <Transition.Child
                  as={Fragment}
                  enter="transition-opacity ease-linear duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity ease-linear duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-gray-900/80" />
                </Transition.Child>

                <div className="fixed inset-0 flex">
                  <Transition.Child
                    as={Fragment}
                    enter="transition ease-in-out duration-300 transform"
                    enterFrom="-translate-x-full"
                    enterTo="translate-x-0"
                    leave="transition ease-in-out duration-300 transform"
                    leaveFrom="translate-x-0"
                    leaveTo="-translate-x-full"
                  >
                    <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-in-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                          <button
                            type="button"
                            className="-m-2.5 p-2.5"
                            onClick={() => setSidebarOpen(false)}
                          >
                            <span className="sr-only">Close sidebar</span>
                            <XMarkIcon
                              className="h-6 w-6 text-white"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </Transition.Child>
                      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                        <div className="flex h-16 shrink-0 items-center">
                          <img
                            className="h-10 w-auto"
                            src="https://dyci.edu.ph/img/DYCI.png"
                            alt="DYCI Logo"
                          />
                        </div>
                        {userRole && (
                          <nav className="flex flex-1 flex-col">
                            <ul
                              role="list"
                              className="flex flex-1 flex-col gap-y-7"
                            >
                              <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                  {navigation.map((item) => (
                                    <li key={item.name}>
                                      <a
                                        href={item.href}
                                        className={classNames(
                                          item.current
                                            ? "bg-gray-50 text-indigo-600"
                                            : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                        )}
                                      >
                                        <item.icon
                                          className={classNames(
                                            item.current
                                              ? "text-indigo-600"
                                              : "text-gray-400 group-hover:text-indigo-600",
                                            "h-6 w-6 shrink-0"
                                          )}
                                          aria-hidden="true"
                                        />
                                        {item.name}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                              {(userRole === "admin" ||
                                userRole === "super-admin") && (
                                <li>
                                  <div className="text-xs font-semibold leading-6 text-gray-400">
                                    Your teams
                                  </div>
                                  <ul
                                    role="list"
                                    className="-mx-2 mt-2 space-y-1"
                                  >
                                    {teams.map((team) => (
                                      <li key={team.name}>
                                        <a
                                          href={team.href}
                                          className={classNames(
                                            team.current
                                              ? "bg-gray-50 text-indigo-600"
                                              : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                          )}
                                        >
                                          <span
                                            className={classNames(
                                              team.current
                                                ? "text-indigo-600 border-indigo-600"
                                                : "text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600",
                                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white"
                                            )}
                                          >
                                            {team.initial}
                                          </span>
                                          <span className="truncate">
                                            {team.name}
                                          </span>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              )}
                            </ul>
                          </nav>
                        )}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    className="h-10 w-auto"
                    src="https://dyci.edu.ph/img/DYCI.png"
                    alt="DYCI Logo"
                  />
                </div>
                {userRole && (
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <a
                                href={item.href}
                                className={classNames(
                                  item.current
                                    ? "bg-gray-50 text-indigo-600"
                                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    item.current
                                      ? "text-indigo-600"
                                      : "text-gray-400 group-hover:text-indigo-600",
                                    "h-6 w-6 shrink-0"
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                      {(userRole === "admin" || userRole === "super-admin") && (
                        <li>
                          <div className="text-xs font-semibold leading-6 text-gray-400">
                            Your teams
                          </div>
                          <ul role="list" className="-mx-2 mt-2 space-y-1">
                            {teams.map((team) => (
                              <li key={team.name}>
                                <a
                                  href={team.href}
                                  className={classNames(
                                    team.current
                                      ? "bg-gray-50 text-indigo-600"
                                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50",
                                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                  )}
                                >
                                  <span
                                    className={classNames(
                                      team.current
                                        ? "text-indigo-600 border-indigo-600"
                                        : "text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600",
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white"
                                    )}
                                  >
                                    {team.initial}
                                  </span>
                                  <span className="truncate">{team.name}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                      <li className="-mx-6 mt-auto">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                          >
                            <span className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                              {getInitials(currentUser?.email || "User")}
                            </span>
                            <span className="sr-only">Your profile</span>
                            <span aria-hidden="true">
                              {currentUser?.email || "User"}{" "}
                            </span>{" "}
                          </button>
                          {dropdownOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                              <button
                                onClick={handleLogout}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Logout
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </div>

            <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
                Dashboard
              </div>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center"
                >
                  <span className="sr-only">Your profile</span>
                  <span className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                    {getInitials(currentUser?.email || "User")}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <main className="py-10 lg:pl-72">
              <div className="px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
          </div>
        )}
      </div>
    </>
  );
}
