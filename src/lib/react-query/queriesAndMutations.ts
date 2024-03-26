import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { SignInAccount, SignOutAccount, createPost, createUserAccount, deleteSavedPost, getCurrentUser, getRecentPosts, likePost, savePost, updatePost } from "@/lib/appwrite/api.ts";
import { INewPost, INewUser, IUpdatePost } from "@/types";
import { QUERY_KEYS } from "./queryKeys";

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      SignInAccount(user),
  });
};
export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: SignOutAccount
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post:INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:  [QUERY_KEYS.GET_RECENT_POSTS]
      })
    }
  })
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  })
}

export const useLikePost = () => {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn:({postId,likesArray}:{postId: string;
     likesArray:string[]}) => likePost(postId,likesArray),
     onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POST_BY_ID,data?.$id]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POST_BY_ID]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_CURRENT_USER]
      })
     }
 })
}

export const useSavePost = () => {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn:({postId,userId}:{postId: string;
     userId:string}) => savePost(postId, userId),
     onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POST_BY_ID]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_CURRENT_USER]
      })
     }
 })
}

export const useDeleteSavedPost = () => {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn:(saveRecordId: string) => deleteSavedPost(saveRecordId),
     onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POST_BY_ID]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey:[QUERY_KEYS.GET_CURRENT_USER]
      })
     }
 })
}

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey:[QUERY_KEYS.GET_CURRENT_USER],
    queryFn:getCurrentUser
  })
  
}