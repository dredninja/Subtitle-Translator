import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function DataAnalysisPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    axios.get("http://localhost:8007/api/data-analysis", {
      headers: { "Authorization": `Bearer ${user.token}` }
    }).then(res => setData(res.data));
  }, [user]);

  if (!user) return <div>Please login to access data analysis.</div>;

  return <div><pre>{JSON.stringify(data, null, 2)}</pre></div>;
}
