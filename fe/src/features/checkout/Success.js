import { clearCart } from "features/cart/slice/cartSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";

const Success = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");
  dispatch(clearCart());
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
//   dispatch(clearCart());
    // Fetch session details from your backend (optional)
    fetch(`${process.env.REACT_APP_API_BASE}/checkout-session?sessionId=${sessionId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setSession(data);
        dispatch(clearCart());
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching session:", error);
        setLoading(false);
      });
    
  }, [sessionId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Payment Successful ✅</h1>
      {sessionId && <p>Session ID: {sessionId}</p>}
      {session && (
        <div>
          <p>Amount: ${(session.amount_total / 100).toFixed(2)}</p>
          <p>Customer: {session.customer_details?.email}</p>
        </div>
      )}
      <a href="/">Go back to Home</a>
    </div>
  );
};

export default Success;
