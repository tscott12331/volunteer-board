function JobPostContainer({ jobPosts }) {
  return (
    <div className="job-post-container">
      {jobPosts.map((post) => (
        <div key={post.id} className="job-post">
          <h2>{post.title}</h2>
          <p>{post.description}</p>
          <p><strong>Location:</strong> {post.location}</p>
          <p><strong>Date:</strong> {post.date}</p>
        </div>
      ))}
    </div>
  );
}

export default JobPostContainer;
