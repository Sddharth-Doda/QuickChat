import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const axiosInstance = axios.create({
    baseURL: backendUrl,
    headers: {
      token: token,
    },
    withCredentials: true,
  });

  // Check auth
  const checkAuth = async () => {
    try {
      const { data } = await axiosInstance.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Login
  const login = async (state, credentials) => {
    try {
      const { data } = await axiosInstance.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    toast.success("Logged out successfully");
    if (socket) socket.disconnect();
  };

  // Update profile
  const updateProfile = async (body) => {
    try {
      const { data } = await axiosInstance.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile Updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Connect socket
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, [token]);

  const value = {
    axios: axiosInstance,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
