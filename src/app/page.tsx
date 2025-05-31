"use client";

import { VerificationLevel, IDKitWidget, useIDKit } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import { verify } from "./actions/verify";
import React, { useEffect } from "react";

export default function Home() {
  const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WLD_ACTION;

  if (!app_id) {
    throw new Error("app_id is not set in environment variables!");
  }
  if (!action) {
    throw new Error("action is not set in environment variables!");
  }

  const { setOpen } = useIDKit();

  // State for petition form
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [petitions, setPetitions] = React.useState<{ title: string; description: string; signatures: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch petitions from backend
  const fetchPetitions = async () => {
    setLoading(true);
    const res = await fetch("/api/petitions");
    const data = await res.json();
    setPetitions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPetitions();
  }, []);

  // Function to handle petition creation
  const handleCreatePetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      const res = await fetch("/api/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowForm(false);
        fetchPetitions();
        window.alert("Petition created!");
      } else {
        const err = await res.json();
        window.alert("Error: " + err.error);
      }
    }
  };

  // Show form only after World ID verification
  const handleCreatePetitionClick = () => {
    setOpen(true);
  };

  // Called after World ID verification
  const onSuccess = (result: ISuccessResult) => {
    window.alert(
      "Successfully verified with World ID! Your nullifier hash is: " +
        result.nullifier_hash
    );
    setShowForm(true);
  };

  const handleProof = async (result: ISuccessResult) => {
    console.log(
      "Proof received from IDKit, sending to backend:\n",
      JSON.stringify(result)
    ); // Log the proof from IDKit to the console for visibility
    const data = await verify(result);
    if (data.success) {
      console.log("Successful response from backend:\n", JSON.stringify(data)); // Log the response from our backend for visibility
    } else {
      throw new Error(`Verification failed: ${data.detail}`);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center align-middle min-h-screen">
        <p className="text-2xl mb-5">World ID Cloud Template</p>
        {/* Create Petition Button */}
        <button
          className="border border-blue-500 text-blue-500 rounded-md mb-4 px-4 py-2"
          onClick={handleCreatePetitionClick}
        >
          Create Petition
        </button>
        {/* Petition Form */}
        {showForm && (
          <form
            onSubmit={handleCreatePetition}
            className="flex flex-col items-center border p-4 mb-4 bg-white rounded shadow"
            style={{ minWidth: 300 }}
          >
            <input
              className="border mb-2 px-2 py-1 w-full"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <textarea
              className="border mb-2 px-2 py-1 w-full"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white rounded px-3 py-1"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-300 rounded px-3 py-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {/* Petition List */}
        <div className="w-full max-w-xl mt-6">
          <h2 className="text-xl font-bold mb-2">Petitions</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : petitions.length === 0 ? (
            <p className="text-gray-500">No petitions yet.</p>
          ) : (
            petitions.map((petition, idx) => (
              <div key={idx} className="border rounded p-4 mb-3 bg-white shadow">
                <h3 className="font-semibold text-lg">{petition.title}</h3>
                <p className="mb-2">{petition.description}</p>
                <div className="text-sm text-gray-600">Signatures: {petition.signatures}</div>
              </div>
            ))
          )}
        </div>
        {/* World ID Widget (hidden, but needed for verification) */}
        <IDKitWidget
          action={action}
          app_id={app_id}
          onSuccess={onSuccess}
          handleVerify={handleProof}
          verification_level={VerificationLevel.Orb}
        />
      </div>
    </div>
  );
}
