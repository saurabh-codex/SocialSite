import PostForm from "@/components/forms/PostForm";
import React from "react";

const CreatePost = () => {
  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-5xl flex-start gap-3 justify-start">
          <img
            src="/assets/icons/add-post.svg"
            alt="add"
            width={36}
            height={36}
          />
          <h2 className="h-3 md:h2-bold text-left w-full ">Create Post</h2>
        </div>
        <PostForm/>
      </div>
    </div>
  );
};

export default CreatePost;
