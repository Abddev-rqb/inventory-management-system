function DeletionRequestsTable({
  requests,
  isProcessing,
  processingRequestId,
  onApprove,
  onReject,
}) {
  return (
    <div className="table-scroll-container">
      <table className="deletion-requests-table">
        <thead>
          <tr>
            <th>
              Order
            </th>

            <th>
              Customer
            </th>

            <th>
              Requested by
            </th>

            <th>
              Reason
            </th>

            <th>
              Status
            </th>

            <th>
              Requested
            </th>

            <th>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {requests.map(
            (request) => {
              const requestId =
                Number(
                  request.id,
                );

              const processing =
                processingRequestId ===
                  requestId &&
                isProcessing;

              const pending =
                request.status ===
                  "pending";

              return (
                <tr
                  key={
                    request.id
                  }
                >
                  <td>
                    <strong>
                      {request.order_number}
                    </strong>
                  </td>

                  <td>
                    {request.customer_name ||
                      "—"}
                  </td>

                  <td>
                    {request.requested_by_name ||
                      request.requested_by ||
                      "—"}
                  </td>

                  <td className="deletion-request-reason">
                    {request.reason}
                  </td>

                  <td>
                    {request.status_label ||
                      formatChoice(
                        request.status,
                      )}
                  </td>

                  <td>
                    {formatDateTime(
                      request.created_at,
                    )}
                  </td>

                  <td>
                    {pending ? (
                      <div className="deletion-review-actions">
                        <button
                          type="button"
                          className="button button-primary"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            onApprove(
                              request,
                            )
                          }
                        >
                          {processing
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            onReject(
                              request,
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      "Reviewed"
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


function formatChoice(
  value,
) {
  if (!value) {
    return "—";
  }

  return String(
    value,
  )
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function formatDateTime(
  value,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    date,
  );
}


export default DeletionRequestsTable;