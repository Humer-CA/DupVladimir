import React, { useEffect, useState } from "react";
import "../../../index.scss";
import NoRecordsFound from "../../../Layout/NoRecordsFound";
import ErrorFetching from "../../ErrorFetching";
import { LoadingData } from "../../../Components/LottieFiles/LottieComponents";
// import AddReceivingInfo from "../../../Pages/Asset Requisition/Receiving of Asset/AddReceivingInfo";

import {
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Add, ArrowBackIosRounded, MoreVert, RemoveCircle, Report } from "@mui/icons-material";

// RTK
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { closeConfirm, onLoading, openConfirm } from "../../../Redux/StateManagement/confirmSlice";
import { openToast } from "../../../Redux/StateManagement/toastSlice";
import { closeDialog, openDialog } from "../../../Redux/StateManagement/booleanStateSlice";
import {
  useGetItemPerTransactionApiQuery,
  useCancelAssetReceivingApiMutation,
} from "../../../Redux/Query/Request/AssetReceiving";
import CustomTablePagination from "../../../Components/Reusable/CustomTablePagination";

const ViewRequestReceiving = () => {
  const { state: transactionData } = useLocation();
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [viewData, setViewData] = useState("");

  const isSmallScreen = useMediaQuery("(max-width: 1375px)");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const dialog = useSelector((state) => state.booleanState.dialog);

  const {
    data: receivingData,
    isLoading: isReceivingLoading,
    isSuccess: isReceivingSuccess,
    isError: isReceivingError,
    error: errorData,
    refetch,
  } = useGetItemPerTransactionApiQuery(
    {
      page: page,
      per_page: perPage,
      transaction_number: transactionData?.transaction_number,
    },
    { refetchOnMountOrArgChange: true }
  );

  const [cancelPo] = useCancelAssetReceivingApiMutation();

  // console.log("receivingData:", receivingData);
  // console.log("transactionData:", transactionData);

  // Table Sorting --------------------------------
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("id");

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };
  const comparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const onSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const perPageHandler = (e) => {
    setPage(1);
    setPerPage(parseInt(e.target.value));
  };

  const pageHandler = (_, page) => {
    // console.log(page + 1);
    setPage(page + 1);
  };
  const handleTableData = (data) => {
    transactionData?.received || data?.remaining === 0 ? null : dispatch(openDialog());
    setViewData(data);
  };
  const onCancelHandler = async (data) => {
    // console.log("data", data);
    dispatch(
      openConfirm({
        icon: Report,
        iconColor: "warning",
        message: (
          <Box>
            <Typography> Are you sure you want to</Typography>
            <Typography
              sx={{
                display: "inline-block",
                color: "secondary.main",
                fontWeight: "bold",
              }}
            >
              CANCEL
            </Typography>{" "}
            {data?.delivered !== 0 ? "remaining Items?" : "this Item?"}
          </Box>
        ),
        remarks: true,

        onConfirm: async (remarks) => {
          try {
            dispatch(onLoading());
            let result = await cancelPo({ id: data?.id, remarks: remarks }).unwrap();
            dispatch(
              openToast({
                message: result?.message,
                duration: 5000,
              })
            );

            dispatch(closeConfirm());
            // console.log(result);
            result?.data?.total_remaining === 0 && navigate(-1);
          } catch (err) {
            console.error(err);
            if (err?.status === 422) {
              dispatch(
                openToast({
                  message: err.data.errors?.detail,
                  duration: 5000,
                  variant: "error",
                })
              );
            } else if (err?.status !== 422) {
              dispatch(
                openToast({
                  message: "Something went wrong. Please try again.",
                  duration: 5000,
                  variant: "error",
                })
              );
            }
          }
        },
      })
    );
  };

  useEffect(() => {
    if (receivingData?.total_remaining === 0) {
      navigate(-1);
    }
  }, [receivingData]);

  return (
    <>
      {isReceivingError && <ErrorFetching refetch={refetch} error={errorData} />}
      {!isReceivingError && (
        <Box className="mcontainer">
          <Button
            variant="text"
            color="secondary"
            size="small"
            startIcon={<ArrowBackIosRounded color="secondary" />}
            onClick={() => {
              navigate(-1);
              // setApprovingValue("2");
            }}
            disableRipple
            sx={{ width: "90px", marginLeft: "-15px", "&:hover": { backgroundColor: "transparent" } }}
          >
            Back
          </Button>

          <Box className="request__wrapper" p={2} pb={0}>
            {/* TABLE */}
            <Box className="request__table">
              <Typography color="secondary.main" sx={{ fontFamily: "Anton", fontSize: "1.5rem", pb: 1 }}>
                {`${transactionData ? "TRANSACTION NO." : "CURRENT ASSET"}`}{" "}
                {transactionData && transactionData?.transaction_number}
              </Typography>

              <TableContainer className="request__th-body  request__wrapper" sx={{ height: "calc(100vh - 300px)" }}>
                <Table className="request__table " stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& > *": {
                          fontWeight: "bold!important",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableCell className="tbl-cell">
                        <TableSortLabel
                          active={orderBy === `reference_number`}
                          direction={orderBy === `reference_number` ? order : `asc`}
                          onClick={() => onSort(`reference_number`)}
                        >
                          Ref Number
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className="tbl-cell">
                        <TableSortLabel
                          active={orderBy === `type_of_request`}
                          direction={orderBy === `type_of_request` ? order : `asc`}
                          onClick={() => onSort(`type_of_request`)}
                        >
                          Type of Request
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className="tbl-cell">
                        <TableSortLabel
                          active={orderBy === `pr_number`}
                          direction={orderBy === `pr_number` ? order : `asc`}
                          onClick={() => onSort(`pr_number`)}
                        >
                          PR Number
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className="tbl-cell">
                        <TableSortLabel
                          active={orderBy === `reference_number`}
                          direction={orderBy === `reference_number` ? order : `asc`}
                          onClick={() => onSort(`reference_number`)}
                        >
                          Acquisition Details
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className="tbl-cell">Asset Information</TableCell>
                      <TableCell className="tbl-cell">Chart of Accounts</TableCell>
                      <TableCell className="tbl-cell">
                        <TableSortLabel
                          active={orderBy === `received`}
                          direction={orderBy === `received` ? order : `asc`}
                          onClick={() => onSort(`received`)}
                        >
                          Item Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell className="tbl-cell" align="center">
                        Action
                      </TableCell>

                      {/* {!transactionData?.received && <TableCell className="tbl-cell text-center">Action</TableCell>} */}
                    </TableRow>
                  </TableHead>

                  <TableBody position="relative">
                    {isReceivingLoading ? (
                      <LoadingData />
                    ) : receivingData?.data.length === 0 ? (
                      <NoRecordsFound />
                    ) : (
                      <>
                        {isReceivingSuccess &&
                          [...receivingData?.data]?.sort(comparator(order, orderBy))?.map((data, index) => (
                            // <Tooltip
                            //   key={index}
                            //   title={data?.remaining === 0 ? null : "Click to Receive Items"}
                            //   placement="left"
                            //   arrow
                            // >
                            <TableRow
                              key={data.id}
                              hover={data?.is_removed === 1 ? false : true}
                              sx={{
                                // cursor: transactionData?.received ? null : "pointer",
                                "&:last-child td, &:last-child th": {
                                  borderBottom: 0,
                                },
                                bgcolor:
                                  (data?.received === data?.ordered ? "#ff00002f" : data?.is_removed) === 1
                                    ? "#ff00002f"
                                    : null,
                                "*": { color: data?.is_removed === 1 ? "black!important" : null },
                              }}
                            >
                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                {data.reference_number}
                              </TableCell>
                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell text-weight">
                                <Typography fontWeight={600}>{data.type_of_request?.type_of_request_name}</Typography>
                                <Typography fontSize="12px" fontWeight="bold" color="quaternary.light">
                                  {data.attachment_type}
                                </Typography>
                              </TableCell>
                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                <Typography fontSize={12}>PR - {data.pr_number}</Typography>
                                <Typography fontSize={12}>PO - {data.po_number}</Typography>
                                <Typography fontSize={12}>RR - {data.rr_number}</Typography>
                              </TableCell>

                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                {data.acquisition_details}
                              </TableCell>
                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                <Typography fontSize="14px" fontWeight="bold">
                                  {data.asset_description}
                                </Typography>
                                <Typography fontSize="12px">{data.asset_specification}</Typography>
                              </TableCell>

                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                <Typography fontSize={10} color="gray">
                                  {`(${data.company?.company_code}) - ${data.company?.company_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.business_unit?.business_unit_code}) - ${data.business_unit?.business_unit_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.department?.department_code}) - ${data.department?.department_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.unit?.unit_code}) - ${data.unit?.unit_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.subunit?.subunit_code}) - ${data.subunit?.subunit_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.location?.location_code}) - ${data.location?.location_name}`}
                                </Typography>
                                <Typography fontSize={10} color="gray">
                                  {`(${data.account_title?.account_title_code}) - ${data.account_title?.account_title_name}`}
                                </Typography>
                              </TableCell>

                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell">
                                <Typography fontSize={12}>Ordered - {data.ordered}</Typography>
                                <Typography fontSize={12}>Received - {data.delivered}</Typography>
                                <Typography fontSize={12}>Remaining - {data.remaining}</Typography>
                              </TableCell>

                              {/* {!transactionData?.received && (
                                <TableCell className="tbl-cell text-center">
                                  {data?.is_removed !== 1 && (
                                    <IconButton
                                      disabled={data?.remaining === 0}
                                      onClick={() => onCancelHandler(data)}
                                      sx={{ color: "error.main", ":hover": { color: "red" } }}
                                    >
                                      <Tooltip
                                        title={data?.delivered !== 0 ? "Cancel Remaining" : "Cancel Request"}
                                        placement="top"
                                        arrow
                                      >
                                        <RemoveCircle />
                                      </Tooltip>
                                    </IconButton>
                                  )}
                                </TableCell>
                              )} */}

                              <TableCell onClick={() => handleTableData(data)} className="tbl-cell" align="center">
                                <Tooltip title="Add Information" placement="top" arrow>
                                  <IconButton>
                                    <MoreVert />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                            // </Tooltip>
                          ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Buttons */}
              <Box className="mcontainer__pagination-export" width="100%" marginInline="auto">
                <Typography fontFamily="Anton, Impact, Roboto" fontSize="18px" color="secondary.main">
                  Transactions : {receivingData?.data?.length} request
                </Typography>

                <CustomTablePagination
                  total={receivingData?.total}
                  success={isReceivingSuccess}
                  current_page={receivingData?.current_page}
                  per_page={receivingData?.per_page}
                  onPageChange={pageHandler}
                  onRowsPerPageChange={perPageHandler}
                  removeShadow
                />
              </Box>
            </Box>
          </Box>

          {/* <Dialog
            open={dialog}
            // onClose={() => dispatch(closeDialog())}
            sx={{
              ".MuiPaper-root": {
                padding: "20px",
                margin: 0,
                gap: "5px",
                minWidth: "250px",
                maxWidth: "750px",
                borderRadius: "10px",
                width: "90%",
              },
            }}
          >
            <AddReceivingInfo data={viewData} />
          </Dialog> */}
        </Box>
      )}
    </>
  );
};

export default ViewRequestReceiving;
