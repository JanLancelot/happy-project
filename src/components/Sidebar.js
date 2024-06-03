import React, { useState, Fragment } from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BellIcon,
  CogIcon,
} from "@heroicons/react/24/outline";

const user = {
  role: "admin",
  name: "Tom Cook",
  profilePicture:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

const navigation = [
  { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
  {
    name: "Clearances",
    href: "#",
    icon: ClipboardDocumentCheckIcon,
    current: false,
    children:
      user.role === "admin"
        ? [
            { name: "All Clearances", href: "#" },
            { name: "Pending Clearances", href: "#" },
          ]
        : [],
  },
  {
    name: "Disciplinary Records",
    href: "#",
    icon: AcademicCapIcon,
    current: false,
    children:
      user.role === "admin"
        ? [
            { name: "All Records", href: "#" },
            { name: "Pending Sanctions", href: "#" },
          ]
        : [],
  },
  { name: "Notifications", href: "#", icon: BellIcon, current: false },
  {
    name: "Settings",
    href: "#",
    icon: CogIcon,
    current: false,
    children:
      user.role === "admin"
        ? [
            { name: "User Management", href: "#" },
            { name: "System Settings", href: "#" },
          ]
        : [],
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Sidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      {/* Mobile Sidebar */}
      <button
        type="button"
        className="lg:hidden fixed z-50 top-4 left-4 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setSidebarOpen(true)}
        style={{ marginTop: "1rem", marginLeft: "1rem" }}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
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
                {/* Mobile Sidebar Content */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-10 w-auto"
                      src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                      alt="Your Company"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {/* Map over your navigation items */}
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <a
                                href={item.href}
                                className={classNames(
                                  item.current
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                )}
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt="Your Company"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {!item.children ? (
                        <a
                          href={item.href}
                          className={classNames(
                            item.current ? "bg-gray-50" : "hover:bg-gray-50",
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700"
                          )}
                        >
                          <item.icon
                            className="h-6 w-6 shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      ) : (
                        <Disclosure as="div">
                          {({ open }) => (
                            <>
                              <Disclosure.Button
                                className={classNames(
                                  item.current
                                    ? "bg-gray-50"
                                    : "hover:bg-gray-50",
                                  "flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-700"
                                )}
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0 text-gray-400"
                                  aria-hidden="true"
                                />
                                {item.name}
                                <ChevronRightIcon
                                  className={classNames(
                                    open
                                      ? "rotate-90 text-gray-500"
                                      : "text-gray-400",
                                    "ml-auto h-5 w-5 shrink-0"
                                  )}
                                  aria-hidden="true"
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel as="ul" className="mt-1 px-2">
                                {item.children.map((subItem) => (
                                  <li key={subItem.name}>
                                    {/* 44px */}
                                    <Disclosure.Button
                                      as="a"
                                      href={subItem.href}
                                      className={classNames(
                                        subItem.current
                                          ? "bg-gray-50"
                                          : "hover:bg-gray-50",
                                        "block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-700"
                                      )}
                                    >
                                      {subItem.name}
                                    </Disclosure.Button>
                                  </li>
                                ))}
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="#"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                >
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={user.profilePicture}
                    alt=""
                  />
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">{user.name}</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">{children} </div>
      </div>
    </div>
  );
};

export default Sidebar;
