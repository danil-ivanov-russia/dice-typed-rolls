import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import throttle from "lodash.throttle";
import { TRAY_SIZE_MODIFIER } from "../tray/InteractiveTray";

const THROTTLE_TIME = 100;
const SIDEBAR_WIDTH = 60;

/**
 * Observe window resize and make sure the plugin keeps its aspect ratio
 */
export function ResizeObserver() {
  useEffect(() => {
    const trayHeight = window.innerHeight * TRAY_SIZE_MODIFIER
    const handleResize = throttle(() => {
      OBR.action.setWidth(trayHeight / 2 + SIDEBAR_WIDTH);
    }, THROTTLE_TIME);

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return null;
}
