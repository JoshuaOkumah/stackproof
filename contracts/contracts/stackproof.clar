;; stackproof.clar - StackProof on-chain proof board
;; A user publishes a short proof of something they built or accomplished.
;; The contract is the single source of truth: author comes from tx-sender,
;; timestamp from stacks-block-height - never from the caller.

;; --- data -------------------------------------------------------------------

(define-map proofs
  { proof-id: uint }
  {
    author: principal,
    content: (string-utf8 280),
    timestamp: uint
  }
)

(define-data-var next-proof-id uint u1)

;; --- errors -----------------------------------------------------------------

(define-constant ERR-EMPTY-CONTENT (err u100))
(define-constant ERR-CONTENT-TOO-LONG (err u101))

;; --- public -----------------------------------------------------------------

;; Publish a proof. Returns (ok proof-id) on success.
(define-public (submit-proof (content (string-utf8 280)))
  (begin
    (asserts! (> (len content) u0) ERR-EMPTY-CONTENT)
    (asserts! (<= (len content) u280) ERR-CONTENT-TOO-LONG)
    (let ((proof-id (var-get next-proof-id)))
      (map-set proofs
        { proof-id: proof-id }
        {
          author: tx-sender,
          content: content,
          timestamp: stacks-block-height
        }
      )
      (var-set next-proof-id (+ proof-id u1))
      (ok proof-id)
    )
  )
)

;; --- read-only --------------------------------------------------------------

;; Return the proof stored at proof-id, or none when it does not exist.
(define-read-only (get-proof (proof-id uint))
  (map-get? proofs { proof-id: proof-id })
)

;; Number of proofs submitted so far (u0 initially).
(define-read-only (get-total-proofs)
  (- (var-get next-proof-id) u1)
)
