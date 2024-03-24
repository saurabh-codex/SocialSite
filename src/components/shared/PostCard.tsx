import { Models } from "appwrite"

type PostCardProps ={
  post: Models.Document;
}
const PostCard = ({post}:PostCardProps) => {
  return (
    <div>PostCard</div>
  )
}

export default PostCard