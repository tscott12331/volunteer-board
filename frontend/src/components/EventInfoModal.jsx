export default function EventInfoModal({
    event,
}) {
    const title = event?.title ?? "Title";
    const description = event?.description ?? "Description";
    const image_url = event?.image_url ?? null;
    const start_at = event?.start_at ?? new Date();
    const startDate = new Date(start_at);
    const org = event?.org ?? "Organization";


    return (
        <div className="modal fade" id="info-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
          <div 
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="staticBackdropLabel">{title}</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {image_url &&
                <img className="img-thumbnail mb-3" src={image_url} />
                }
                <p>{description}</p>
                <p className="mb-1">Posted by: {org}</p>
                <p className="mb-1">Date: {startDate.toLocaleDateString()}</p>
                <p className="mb-1">Time: {startDate.toLocaleTimeString()}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary">Register</button>
              </div>
            </div>
          </div>
        </div>
    )
}
