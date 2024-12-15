import { TabName } from "@/types";
import React from "react";

type TabControllerProps = {
  setActiveTab: React.Dispatch<React.SetStateAction<TabName>>;
  activeTab: TabName;
};

function TabController(props: TabControllerProps) {
  return (
    <div className="flex space-x-4 mb-6 border-b border-gray-200">
      <button
        onClick={() => props.setActiveTab(TabName.Image)}
        className={`pb-2 ${
          props.activeTab === TabName.Image
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        이미지
      </button>
      <button
        onClick={() => props.setActiveTab(TabName.Video)}
        className={`pb-2 ${
          props.activeTab === TabName.Video
            ? "text-blue-600 font-semibold border-b-2 border-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        영상
      </button>
    </div>
  );
}

export default TabController;
