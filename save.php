<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['truck_number']) && isset($_POST['truck_weight'])) {
    $truck_number = $_POST['truck_number'];
    $truck_weight = $_POST['truck_weight'];
    $query = "INSERT INTO o_wb_in (WB_TRUCK_NUMBER, WB_TRUCK_WEIGHT) VALUES ($truck_number, $truck_weight)";

    // echo "Data success recorded $truck_number, $truck_weight";
}
