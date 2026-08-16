import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import axiosClient from "./axiosClient.js";

import {
  approveOrderDeletionRequest,
  bulkDispatchOrders,
  createOrder,
  deleteDispatchedOrder,
  dispatchOrder,
  exportSalesReport,
  getDispatchedOrders,
  getOrderDeletionRequests,
  getPendingOrders,
  getSalesReport,
  rejectOrderDeletionRequest,
  requestOrderDeletion,
} from "./orderApi.js";


vi.mock(
  "./axiosClient.js",
  () => ({
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  }),
);


describe(
  "orderApi",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "loads pending orders",
      async () => {
        axiosClient.get
          .mockResolvedValue({
            data: {
              results: [],
            },
          });

        await getPendingOrders({
          page: 2,
        });

        expect(
          axiosClient.get,
        ).toHaveBeenCalledWith(
          "/orders/",
          {
            params: {
              page: 2,
            },
          },
        );
      },
    );

    it(
      "creates an order",
      async () => {
        const payload = {
          customer_name:
            "Customer",

          price_mode:
            "retail",

          laptop_items: [],
          custom_items: [],
        };

        axiosClient.post
          .mockResolvedValue({
            data: {
              id: 1,
            },
          });

        await createOrder(
          payload,
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/orders/",
          payload,
        );
      },
    );

    it(
      "dispatches one order",
      async () => {
        axiosClient.post
          .mockResolvedValue({
            data: {},
          });

        await dispatchOrder(
          12,
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/orders/12/dispatch/",
          {},
        );
      },
    );

    it(
      "bulk dispatches orders",
      async () => {
        axiosClient.post
          .mockResolvedValue({
            data: {},
          });

        await bulkDispatchOrders(
          [
            12,
            13,
          ],
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/orders/dispatch/bulk/",
          {
            order_ids: [
              12,
              13,
            ],
          },
        );
      },
    );

    it(
      "loads dispatched orders",
      async () => {
        axiosClient.get
          .mockResolvedValue({
            data: {
              results: [],
            },
          });

        await getDispatchedOrders();

        expect(
          axiosClient.get,
        ).toHaveBeenCalledWith(
          "/orders/dispatched/",
          {
            params: {},
          },
        );
      },
    );

    it(
      "submits deletion request",
      async () => {
        axiosClient.post
          .mockResolvedValue({
            data: {},
          });

        await requestOrderDeletion(
          20,
          "Incorrect sale",
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/orders/20/deletion-request/",
          {
            reason:
              "Incorrect sale",
          },
        );
      },
    );

    it(
      "deletes dispatched order",
      async () => {
        axiosClient.delete
          .mockResolvedValue({
            data: {},
          });

        await deleteDispatchedOrder(
          20,
        );

        expect(
          axiosClient.delete,
        ).toHaveBeenCalledWith(
          "/orders/20/",
        );
      },
    );

    it(
      "loads deletion requests",
      async () => {
        axiosClient.get
          .mockResolvedValue({
            data: [],
          });

        await getOrderDeletionRequests();

        expect(
          axiosClient.get,
        ).toHaveBeenCalledWith(
          "/order-deletion-requests/",
          {
            params: {},
          },
        );
      },
    );

    it(
      "approves deletion request",
      async () => {
        axiosClient.post
          .mockResolvedValue({
            data: {},
          });

        await approveOrderDeletionRequest(
          7,
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/order-deletion-requests/7/approve/",
          {},
        );
      },
    );

    it(
      "rejects deletion request",
      async () => {
        axiosClient.post
          .mockResolvedValue({
            data: {},
          });

        await rejectOrderDeletionRequest(
          7,
        );

        expect(
          axiosClient.post,
        ).toHaveBeenCalledWith(
          "/order-deletion-requests/7/reject/",
          {},
        );
      },
    );

    it(
      "loads sales report",
      async () => {
        axiosClient.get
          .mockResolvedValue({
            data: {
              results: [],
            },
          });

        await getSalesReport({
          start_date:
            "2026-08-01",

          end_date:
            "2026-08-09",
        });

        expect(
          axiosClient.get,
        ).toHaveBeenCalledWith(
          "/orders/sales/",
          {
            params: {
              start_date:
                "2026-08-01",

              end_date:
                "2026-08-09",
            },
          },
        );
      },
    );

    it(
      "requests sales export as blob",
      async () => {
        const blob =
          new Blob([
            "excel",
          ]);

        axiosClient.get
          .mockResolvedValue({
            data: blob,
            headers: {},
          });

        const result =
          await exportSalesReport({
            start_date:
              "2026-08-01",
          });

        expect(
          axiosClient.get,
        ).toHaveBeenCalledWith(
          "/orders/sales/export/",
          {
            params: {
              start_date:
                "2026-08-01",
            },

            responseType:
              "blob",
          },
        );

        expect(
          result.blob,
        ).toBe(blob);
      },
    );
  },
);