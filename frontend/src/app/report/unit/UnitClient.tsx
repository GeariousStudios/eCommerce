"use client";

import { FormEvent, useEffect, useState } from "react";
import Input from "../../components/input/Input";
import {
  buttonPrimaryClass,
  hyperLinkButtonClass,
  iconbuttonDeletePrimaryClass,
  iconButtonPrimaryClass,
} from "../../styles/buttonClasses";
import Message from "../../components/message/Message";
import CustomTooltip from "../../components/customTooltip/CustomTooltip";
import { useToast } from "../../components/toast/ToastProvider";
import { useParams } from "next/navigation";

type Props = {
  isAuthReady: boolean | null;
  // isLoggedIn: boolean | null;
  // isAdmin: boolean | null;
  isConnected: boolean | null;
};

const UnitClient = (props: Props) => {
  // --- VARIABLES ---
  // --- States: Unit ---
  const [unitName, setUnitName] = useState("");
  const [unitGroupId, setUnitGroupId] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  // --- States: UnitGroup ---
  const [unitGroupName, setUnitGroupName] = useState("");

  // --- States: Other ---
  const [isLoading, setIsLoading] = useState(true);

  // --- Other ---
  const params = useParams();
  const unitId = params?.id;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();

  // --- BACKEND ---
  // --- Fetch unit ---
  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch(`${apiUrl}/unit/fetch/${unitId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
        } else {
          fillUnitData(result);
        }
      } catch (err) {
        notify("error", String(err));
      }
    };

    const fillUnitData = (result: any) => {
      setUnitName(result.name ?? "");
      setUnitGroupId(String(result.unitGroupId ?? ""));
      setIsHidden(result.isHidden ?? false);
    };

    if (unitId) {
      fetchUnit();
    }
  }, [unitId]);

  // --- Fetch unit group ---
  useEffect(() => {
    if (!unitGroupId) {
      return;
    }

    const fetchUnitGroup = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/unit-group/fetch/${unitGroupId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          notify("error", result.message);
        } else {
          fillUnitGroupData(result);
        }
      } catch (err) {
        notify("error", String(err));
      } finally {
        setIsLoading(false);
      }
    };

    const fillUnitGroupData = (result: any) => {
      setUnitGroupName(result.name ?? "");
    };

    fetchUnitGroup();
  }, [unitGroupId]);

  if (!isLoading && isHidden) {
    return <Message icon="lock" content="lock" fullscreen={true} />;
  } else if (!isLoading && !isHidden) {
    return (
      <>
        <div>
          <strong className="text-[var(--accent-color)]">ID:</strong> {unitId}
        </div>
        <div>
          <strong className="text-[var(--accent-color)]">Namn:</strong>{" "}
          {unitName}
        </div>
        <div>
          <strong className="text-[var(--accent-color)]">Enhetsgrupp:</strong>{" "}
          {unitGroupName}
        </div>
        <Message
          icon="work"
          content="Denna vy är ej påbörjad ännu!"
          fullscreen={true}
        />
      </>
    );
  }
};

export default UnitClient;
