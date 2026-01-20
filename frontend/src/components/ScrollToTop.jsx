import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const adminContent = document.querySelector("[data-admin-page-content]");
    if (adminContent) {
      adminContent.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
