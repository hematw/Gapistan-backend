import { Button } from "@heroui/button";
import { User } from "@heroui/user";
import {
  ChevronLeft,
  EllipsisVertical,
  Lock,
  LockOpen,
  LogOut,
  Pen,
  PhoneCall,
  ScrollText,
  SquarePen,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import getFileURL from "../utils/getFileURL";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import CustomModal from "./CustomModal";
import { Input } from "@heroui/input";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosIns from "../utils/axios";
import { Tooltip } from "@heroui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { addToast } from "@heroui/toast";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { isGlobalE2EEEnabled, shouldUseE2EE } from "../utils/e2ee";

function ChatHeader({
  selectedChat,
  setSelectedChat,
  setSelectedUser,
  handleCall,
  onRightSidebarOpen,
  onE2EEChange,
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isReportOpen,
    onOpen: onReportOpen,
    onClose: onReportClose,
  } = useDisclosure();
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const fileInputRef = useRef();

  const [profilePreview, setProfilePreview] = useState(() => {
    return getFileURL(selectedChat.profile) || null;
  });

  // For editing group
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      chatName: selectedChat?.chatName || "",
      profile: getFileURL(selectedChat?.profile) || null,
    },
  });

  // For reporting user
  const {
    register: registerReport,
    handleSubmit: handleReportSubmit,
    formState: { errors: reportErrors },
    reset: resetReport,
  } = useForm({
    defaultValues: {
      reason: "",
    },
  });

  useEffect(() => {
    reset({
      chatName: selectedChat.chatName || "",
      profile: getFileURL(selectedChat?.profile) || null,
    });
  }, [selectedChat, reset]);

  useEffect(() => {
    if (!isReportOpen) {
      resetReport({ reason: "" });
    }
  }, [isReportOpen, resetReport]);

  const editMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosIns.put(`/chats/${selectedChat._id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      onEditClose();
      queryClient.setQueryData(["chats"], (oldChats) =>
        oldChats.map((chat) =>
          chat._id === selectedChat._id ? { ...chat, ...data } : chat
        )
      );
    },
    onError: (error) => {
      console.error("Error updating chat:", error);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async ({ chatId }) => {
      const { data } = await axiosIns.put(`/chats/${chatId}/leave`);
      return data;
    },
    onSuccess: () => {
      onEditClose();
      queryClient.setQueryData(["chats"], (oldChats) => ({
        chats: oldChats.chats?.filter((chat) => chat._id !== selectedChat._id),
      }));
    },
    onError: (error) => {
      console.error("Error leaving chat:", error);
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ reportedUser, reason }) => {
      const { data } = await axiosIns.post("/reports", {
        reportedUser,
        reason,
      });
      return data;
    },
    onSuccess: () => {
      onReportClose();
      addToast({
        title: "User Reported",
        message: "Thank you for your report. We will review it shortly.",
        type: "success",
      }
      )
    },
    onError: (error) => {
      console.error("Error reporting user:", error);
      addToast({
        title: "Error",
        message: "There was an error reporting the user. Please try again.",
        type: "error",
      });
    },
  });

  const e2eeMutation = useMutation({
    mutationFn: async (e2eeEnabled) => {
      const { data } = await axiosIns.put(`/chats/${selectedChat._id}/e2ee`, {
        e2eeEnabled,
      });
      return data;
    },
    onSuccess: (data) => {
      const enabled = data.chat.e2eeEnabled;
      setSelectedChat((prev) => ({ ...prev, e2eeEnabled: enabled }));
      onE2EEChange?.(enabled);
      queryClient.setQueryData(["chats"], (prev) => {
        if (!prev?.chats) return prev;
        return {
          ...prev,
          chats: prev.chats.map((c) =>
            c._id === selectedChat._id ? { ...c, e2eeEnabled: enabled } : c
          ),
        };
      });
      addToast({
        title: enabled ? "Encryption enabled" : "Encryption disabled",
        description: enabled
          ? "New messages in this chat are end-to-end encrypted."
          : "New messages in this chat are sent as plaintext.",
        color: enabled ? "success" : "warning",
      });
    },
    onError: (error) => {
      addToast({
        title: "Could not update encryption",
        description:
          error.response?.data?.message || "Please try again later.",
        color: "danger",
      });
    },
  });

  const canToggleE2EE =
    isGlobalE2EEEnabled() &&
    (!selectedChat.isGroup ||
      selectedChat.groupAdmins?.some((admin) => admin === user._id));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePreview(URL.createObjectURL(file));
      setValue("profile", e.target.files);
    }
  };

  const handleEditSubmit = handleSubmit((formData) => {
    const formPayload = new FormData();
    formPayload.append("chatName", formData.chatName);
    if (formData.profile?.[0]) {
      formPayload.append("profile", formData.profile[0]);
    }
    editMutation.mutate(formPayload);
  });

  // Find the other user in the chat (not me)
  const getOtherUserId = () => {
    if (!selectedChat.members) return null;
    return selectedChat.members.find((m) => m._id !== user._id)?._id;
  };

  const handleReportUser = handleReportSubmit((data) => {
    const reportedUser = getOtherUserId();
    console.log("oooo 🔰🔰🔰");
    if (!reportedUser) return;
    reportMutation.mutate({
      reportedUser,
      reason: data.reason,
    });
  });

  return (
    <div className="flex items-center justify-between p-2 border-b border-default-200">
      <div className="flex items-center gap-2">
        <Button
          startContent={<ChevronLeft />}
          isIconOnly
          variant="fade"
          onPress={() => {
            setSelectedChat(null);
            setSelectedUser(null);
          }}
        />
        <User
          name={selectedChat.chatName}
          description={!!selectedChat.username && `@${selectedChat.username}`}
          avatarProps={{
            src: selectedChat.profile ? getFileURL(selectedChat.profile) : "",
            fallback: selectedChat?.chatName[0],
          }}
          classNames={{
            name: "capitalize",
          }}
          onClick={onRightSidebarOpen}
        />
        {shouldUseE2EE(selectedChat) && (
          <Chip
            size="sm"
            variant="flat"
            color="success"
            startContent={<Lock size={12} />}
            className="hidden sm:flex"
          >
            Encrypted
          </Chip>
        )}
      </div>
      <div className="flex items-center gap-2">
        {canToggleE2EE && (
          <Tooltip
            content={
              shouldUseE2EE(selectedChat)
                ? "End-to-end encryption is on"
                : "End-to-end encryption is off"
            }
          >
            <Switch
              size="sm"
              isSelected={shouldUseE2EE(selectedChat)}
              isDisabled={e2eeMutation.isPending}
              onValueChange={(enabled) => e2eeMutation.mutate(enabled)}
              thumbIcon={({ isSelected }) =>
                isSelected ? <Lock size={12} /> : <LockOpen size={12} />
              }
              aria-label="Toggle end-to-end encryption"
            />
          </Tooltip>
        )}
        <Tooltip content="Call" placement="top">
          <Button
            isIconOnly
            radius="full"
            startContent={<PhoneCall />}
            className="bg-limegreen text-black"
            onPress={handleCall}
          />
        </Tooltip>
        <Dropdown aria-label="Dropdown for chat options">
        <DropdownTrigger>
          <Button
            startContent={<EllipsisVertical />}
            variant="fade"
            isIconOnly
            radius="full"
          />
        </DropdownTrigger>
        <DropdownMenu>
          {!selectedChat.isGroup && (
            <DropdownItem
              className="p-2"
              startContent={<ScrollText />}
              onPress={onReportOpen}
            >
              Report {selectedChat.isGroup ? "Group" : "User"}
            </DropdownItem>
          )}
          {selectedChat.isGroup && (
            <>
              {selectedChat.groupAdmins.some((admin) => admin === user._id) && (
                <DropdownItem
                  className="p-2"
                  startContent={<SquarePen />}
                  onPress={onEditOpen}
                >
                  Edit Group
                </DropdownItem>
              )}
              <DropdownItem
                className="p-2"
                startContent={<LogOut />}
                onPress={onOpen}
              >
                Leave Group
              </DropdownItem>
            </>
          )}
        </DropdownMenu>
      </Dropdown>
      </div>
      {/* Leave Group Modal */}
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        message={`Are you sure to leave "${selectedChat.chatName}"?`}
        confirmMessage="Leave Group"
        onConfirm={() => {
          leaveMutation.mutate({ chatId: selectedChat._id });
          setSelectedChat(null)
          onClose();
        }}
      />
      {/* Edit Group Modal */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        confirmMessage={"Save Changes"}
        onConfirm={handleEditSubmit}
      >
        <form
          onSubmit={handleEditSubmit}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div className="relative max-w-fit">
            <div className="w-24 h-24 rounded-full overflow-hidden border">
              <img
                src={profilePreview || "/default-avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              isIconOnly
              size="sm"
              radius="full"
              startContent={<Pen />}
              onPress={() => fileInputRef.current.click()}
              className="absolute top-0 left-0 w-24 h-24 opacity-50"
            />
            <input
              type="file"
              accept="image/*"
              {...register("profile")}
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
            />
          </div>
          <Input
            {...register("chatName", {
              required: "Group name is required",
            })}
            label="Group Name"
            className="w-full"
            errorMessage={errors?.chatName?.message}
            isInvalid={!!errors?.chatName}
          />
        </form>
      </CustomModal>
      {/* Report User Modal */}
      <CustomModal
        isOpen={isReportOpen}
        onClose={onReportClose}
        confirmMessage="Report"
        onConfirm={handleReportUser}
      >
        <form onSubmit={handleReportUser} className="space-y-4">
          <Input
            {...registerReport("reason", {
              required: "Reason is required",
              minLength: {
                value: 5,
                message: "Reason must be at least 5 characters",
              },
            })}
            label="Reason for reporting"
            className="w-full"
            errorMessage={reportErrors?.reason?.message}
            isInvalid={!!reportErrors?.reason}
            autoFocus
          />
        </form>
      </CustomModal>
    </div>
  );
}

export default ChatHeader;
