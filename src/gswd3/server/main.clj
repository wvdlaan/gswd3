(ns gswd3.server.main
  (:require [compojure.core :as cmp]
            [compojure.route :as rte]
            [compojure.handler :as hnl]
            [compojure.response :as response]
            [hiccup.page :as hic]
            [hiccup.element :as elm]
            [hiccup.middleware :as mdl]
            [ring.middleware.stacktrace :as rst]))

;; middleware

(defn- log [msg & vals]
  (let [line (apply format msg vals)]
    (locking System/out (println line))))

(defn wrap-request-logging [handler]
  (fn [{:keys [request-method uri] :as req}]
    (let [start  (System/currentTimeMillis)
          resp   (handler req)
          finish (System/currentTimeMillis)
          total  (- finish start)]
      (log "request %s %s (%dms)" request-method uri total)
      resp)))

(defn wrap-bounce-favicon [handler]
  (fn [req]
    (if (= [:get "/favicon.ico"] [(:request-method req) (:uri req)])
      {:status 404
       :headers {}
       :body ""}
      (handler req))))

;; views

(defn draw [script]
  (let [data "'data/service_status.json'"
        draw (str "gswd3.client.main." script)]
    (hic/html5
     [:head
      (hic/include-js "d3.js")
      (hic/include-js "main.js")]
     [:body
      [:script (str "d3.json(" data ", " draw ");")]])))

(defn link [script]
  [:li [:a {:href script} script]])

(defn index-page []
  (hic/html5
   [:head
    [:title "Getting Started with D3"]]
   [:body
    [:h2 "Getting Started with D3"]
    [:ul
     (link "service_status")]]))

;; routes

(cmp/defroutes main-routes
  (cmp/GET "/" [] (index-page))
  (cmp/GET "/service_status" [] (draw "service_status"))
  (rte/resources "/")
  (rte/not-found "Page not found!"))

;; server

(def server
  (-> (hnl/site main-routes)
      (wrap-request-logging)
      (wrap-bounce-favicon)
      (rst/wrap-stacktrace)
      (mdl/wrap-base-url)))
