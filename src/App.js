import React, {Component} from "react";

import logo from "./logo.svg";

import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "",
      depth: "",
      crawlingStatus: null,
      data: null,
      taskID: null,
      uniqueID: null,
      error: null
    };

    this.statusInterval = 1;
  }

  handleStartButton = event => {
    event.preventDefault();

    if (!this.state.url)
      return false;

    this.setState({ data: null, error: null });

    //    var payload = {
    //    url:this.state.url
    //};
    //
    //var data = new FormData();
    //data.append( "url", JSON.stringify( payload ) );
    // send a post request to client when form button clicked
    // django response back with task_id and unique_id.
    // We have created them in views.py file, remember?
    fetch("http://localhost:8000/api/crawl/", {
      body: JSON.stringify({ url: this.state.url, depth: this.state.depth }),
      method: "POST",
      "headers": new Headers({ "X-Requested-With": "XMLHttpRequest" })
    })
      .then(function(response) {
        return response.json();
      })
      .then(resp => {
        console.log(resp);

        if (resp.error) {
          this.setState({ error: resp.error });

          return;
        }

        console.log(resp);

        // Update the state with new task and unique id
        this.setState(
          {
            taskID: resp.task_id,
            uniqueID: resp.unique_id,
            crawlingStatus: resp.status
          },
          () => {
            // ####################### HERE ########################
            // After updating state,
            // i start to execute checkCrawlStatus method for every 2 seconds
            // Check method's body for more details
            // ####################### HERE ########################
            this.statusInterval = setInterval(this.checkCrawlStatus, 2000);
          }
        );
      });
  };

  componentWillUnmount() {
    // i create this.statusInterval inside constructor method
    // So clear it anyway on page reloads or
    clearInterval(this.statusInterval);
  }

  checkCrawlStatus = () => {
    // this method do only one thing.
    // Making a request to server to ask status of crawling job
    fetch(
      `http://localhost:8000/api/crawl/?task_id=${this.state.taskID}&unique_id=${this.state.uniqueID}`,
      { method: "GET" }
    )
      .then(resp => resp.json())
      .then(resp => {
        if (resp.data) {
          // If response contains a data array
          // That means crawling completed and we have results here
          // No need to make more requests.
          // Just clear interval
          clearInterval(this.statusInterval);

          this.setState({ data: resp.data, crawlingStatus: "Completed!" });
        } else if (resp.error) {
          // If there is an error
          // also no need to keep requesting
          // just show it to user
          // and clear interval
          clearInterval(this.statusInterval);

          this.setState({ error: resp.error, crawlingStatus: null });
        } else if (resp.status) {
          // but response contains a `status` key and no data or error
          // that means crawling process is still active and running (or pending)
          // don't clear the interval.
          this.setState({ crawlingStatus: resp.status });
        }
      });
  };

  render() {
    const { error, crawlingStatus, data } = this.state;

    return (
      <div style={{ height: "100%", width: "100%",padding:32 }}>
        <form onSubmit={e => this.handleStartButton(e)}>
          <input required placeholder="Enter a url" style={
            { margin: "16px 16px 16px 0" }
          } value={this.state.url} onChange={
            e => this.setState({ url: e.target.value })
          } />
          <input required placeholder="Depth you want to crawl" style={
            { margin: 16 }
          } value={this.state.depth} type="number" onChange={
            e => this.setState({ depth: e.target.value })
          } />
          <button type="submit">Crawl!</button>
        </form>
        <blink style={{ color: "green" }}>{crawlingStatus}</blink>
        {error && <h5 style={{ color: "red" }}>{error}</h5>}
        {data && data.length > 0 && data.map(
              (datum, index) => <div key={`list_${index}`}>
                <h3>{datum.page_link}</h3>
                <ul>
                  {datum.image_urls.map(
                      (src, srcIndex) => <li key={`img_${srcIndex}`}>
                        <img src={src} alt="image" style={
                          {
                            width: 400,
                            height: 400,
                            padding: 4,
                            border: "solid 1px",
                            objectFit:'contain'
                          }
                        } />
                      </li>
                    )}
                </ul>
              </div>
            )}
      </div>
    );
  }
}

export default App