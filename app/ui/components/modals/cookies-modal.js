import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import autobind from 'autobind-decorator';
import Modal from '../base/modal';
import ModalBody from '../base/modal-body';
import ModalHeader from '../base/modal-header';
import ModalFooter from '../base/modal-footer';
import CookiesEditor from '../editors/cookies-editor';
import * as models from '../../../models';
import {trackEvent} from '../../../analytics/index';

@autobind
class CookiesModal extends PureComponent {
  constructor (props) {
    super(props);
    this.state = {
      cookieJar: null,
      workspace: null,
      filter: ''
    };
  }

  _setModalRef (n) {
    this.modal = n;
  }

  _setFilterInputRef (n) {
    this.filterInput = n;
  }

  async _saveChanges () {
    const {cookieJar} = this.state;
    await models.cookieJar.update(cookieJar);
    this._load();
  }

  _handleCookieUpdate (oldCookie, cookie) {
    const {cookieJar} = this.state;
    const {cookies} = cookieJar;
    const index = cookies.findIndex(c => c.domain === oldCookie.domain && c.key === oldCookie.key);

    cookieJar.cookies = [
      ...cookies.slice(0, index),
      cookie,
      ...cookies.slice(index + 1)
    ];

    this._saveChanges(cookieJar);
    trackEvent('Cookie', 'Update');
  }

  _handleCookieAdd (cookie) {
    const {cookieJar} = this.state;
    const {cookies} = cookieJar;
    cookieJar.cookies = [cookie, ...cookies];
    this._saveChanges(cookieJar);
    trackEvent('Cookie', 'Create');
  }

  _handleCookieDelete (cookie) {
    const {cookieJar} = this.state;
    const {cookies} = cookieJar;

    // NOTE: This is sketchy because it relies on the same reference
    cookieJar.cookies = cookies.filter(c => c !== cookie);

    this._saveChanges(cookieJar);
    trackEvent('Cookie', 'Delete');
  }

  _handleFilterChange (e) {
    const filter = e.target.value;
    this.setState({filter});
    trackEvent('Cookie Editor', 'Filter Change');
  }

  _getFilteredSortedCookies () {
    const {cookieJar, filter} = this.state;

    if (!cookieJar) {
      // Nothing to do yet.
      return [];
    }

    const {cookies} = cookieJar;
    return cookies.filter(c => {
      const toSearch = JSON.stringify(c).toLowerCase();
      return toSearch.indexOf(filter.toLowerCase()) !== -1;
    });
  }

  async _load () {
    const {workspace} = this.props;
    const cookieJar = await models.cookieJar.getOrCreateForWorkspace(workspace);
    this.setState({cookieJar});
  }

  async show () {
    this.modal.show();
    await this._load();
    setTimeout(() => {
      this.filterInput.focus();
    }, 100);
    trackEvent('Cookie Editor', 'Show');
  }

  hide () {
    this.modal.hide();
  }

  toggle () {
    if (this.modal.isOpen()) {
      this.hide();
    } else {
      this.show();
    }
  }

  render () {
    const filteredCookies = this._getFilteredSortedCookies();
    const {filter} = this.state;

    return (
      <Modal ref={this._setModalRef} wide tall {...this.props}>
        <ModalHeader>Manage Cookies</ModalHeader>
        <ModalBody className="cookie-editor" noScroll>
          <div className="pad">
            <div className="form-control form-control--outlined">
              <label>Filter Cookies
                <input ref={this._setFilterInputRef}
                       onChange={this._handleFilterChange}
                       type="text"
                       placeholder="twitter.com"
                       defaultValue=""/>
              </label>
            </div>
          </div>
          <div className="cookie-editor__editor border-top">
            <div className="pad-top">
              <CookiesEditor
                cookies={filteredCookies}
                onCookieUpdate={this._handleCookieUpdate}
                onCookieAdd={this._handleCookieAdd}
                onCookieDelete={this._handleCookieDelete}
                // Set the domain to the filter so that it shows up if we're filtering
                newCookieDomainName={filter || 'domain.com'}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="margin-left faint italic txt-sm tall">
            * cookies are automatically sent with relevant requests
          </div>
          <button className="btn" onClick={this.hide}>
            Done
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}

CookiesModal.propTypes = {
  workspace: PropTypes.object.isRequired
};

// export CookiesModal;
export default CookiesModal;
