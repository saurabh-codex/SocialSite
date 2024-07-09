import { ID, Query } from "appwrite";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { INewPost, INewUser,IUpdatePost, IUpdateUser } from "@/types";



export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) {
      throw new Error("Failed to create user account");
    }

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl.toString(), // Convert URL to string
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: string; // Changed type to string
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    return newUser;
  } catch (error) {
    console.error("Error saving user to database:", error);
    throw error;
  }
}

export async function SignInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailSession(user.email, user.password);
    return session;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    console.error("Error getting account:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    // console.log(currentAccount);
    
    if (!currentAccount) {
      throw new Error("Current account not found");
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );
    // console.log(databases.listDocuments);
    
    if (!currentUser) {
      throw new Error("Current user not found in database");
    }

    return currentUser.documents[0];
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
}

export async function SignOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export async function createPost(post: INewPost) {
  try {
    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) {
      throw new Error("Failed to upload file");
    }

    const fileUrl = await getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw new Error("Failed to get file preview URL");
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw new Error("Failed to create new post");
    }

    return newPost;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}


export async function uploadFile(file:File){
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );
    return uploadedFile;
  } catch (error) {
    console.log(error);
    
  }
}

export async function getFilePreview(fileId:string): Promise<string | undefined> {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100,
    );

    if(!fileUrl) throw Error;


    return fileUrl.toString();
  } catch (error) {
    console.log(error);
    return undefined;
    
  }
}

export async function deleteFile(fileId:string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return{status: 'ok'}
  } catch (error) {
    console.log(error);
    
  }
  
}

export async function getRecentPosts(){
  const posts = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc('$createdAt'),Query.limit(20)]
  )
  if(!posts) throw Error;

  return posts;
}


export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = await getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function likePost(postId:string, likesArray:string[]){
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {likes:likesArray}
    )
    if(!updatePost) throw Error
    return updatedPost
  } catch (error) {
    console.log(error);
    
  }
}
export async function savePost(postId:string, userId:string){
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {user:userId,
      post:postId}
    )
    if(!updatedPost) throw Error
    return updatedPost
  } catch (error) {
    console.log(error);
    
  }
}
export async function deleteSavedPost(saveRecordId:string){
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      saveRecordId
    )
    if(!statusCode) throw Error
    return {status:'ok'}
  } catch (error) {
    console.log(error);
    
  }
}

export async function getPostById(postId:string){
  try {
    const post =await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )
    return post;
  } catch (error) {
    console.log(error);
    
  }
}

export async function deletePost(postId:string, imageId:string){
  if(!postId || !imageId) throw Error;

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )
    return {status:'ok'}
  } catch (error) {
    console.log(error);
    
  }
}

export async function getInfinitePosts({pageParam}:{pageParam:number}){
  const queries: any[] = [Query.orderDesc('$updatedAt'),Query.limit(10)]

  if(pageParam){
    queries.push(Query.cursorAfter(pageParam.toString()));

  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    )
    if(!posts) throw Error;
    return posts;
    
  } catch (error) {
    console.log(error);
    
  }
}
export async function searchPosts(searchTerm:string){

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search('caption', searchTerm)]
    )
    if(!posts) throw Error;
    return posts;

  } catch (error) {
    console.log(error);
    
  }
}

export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc('$createdAt')];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    // Check if users is not undefined before returning
    if (users !== undefined) {
      return users;
    } else {
      throw new Error('Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Re-throw the error to handle it in the caller function
  }
}


export async function getUserById(userId:string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    )
    if(!user) throw Error;
    return user;

  } catch (error) {
    console.log(error);
    
  }
  
}

export async function updateUser(user:IUpdateUser){
  const hasFileToUpdate = user.file.length>0;

  try {
     let image ={
    imageUrl: user.imageUrl as string,
    imageId : user.imageId
  }

  if(hasFileToUpdate){
    const uploadedFile = await uploadFile(user.file[0]);
    if(!uploadedFile) throw Error;

    const fileUrl = await getFilePreview(uploadedFile.$id)
    if(!fileUrl){
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    image = {...image, imageUrl:fileUrl, imageId: uploadedFile.$id};
  }

  const updatedUser = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    user.userId,
    {
      name :user.name,
      bio : user.bio,
      imageUrl: image.imageUrl,
      imageId: image.imageId,
    }
  )

  if(!updatedUser){
    if(hasFileToUpdate){
      await deleteFile(image.imageId)
    }
    throw Error;
  }
  if(user.imageId && hasFileToUpdate){
    await deleteFile(user.imageId)
  }
  return updatedUser;
}catch(error){
  console.log(error);
  
}
}